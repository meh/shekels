module Component

class Table < Lissio::Component
	def initialize(parent, &block)
		super(parent)

		if block.arity == 0
			instance_exec(&block)
		else
			block.call(self)
		end if block
	end

	def columns(*names)
		names.empty? ? @columns : @columns = names
	end

	def rows(*rows)
		rows.empty? ? @rows : @rows = rows
	end

	def render
		element.inner_dom {|d|
			d.tr {
				columns.each {|name|
					d.th name.capitalize
				}
			}

			rows.each {|row|
				d.tr {
					columns.each {|name|
						d.td row[name].to_s
					}
				}
			}
		}
	end

	tag name: :table, class: :shekels

	css do
		rule 'table.shekels' do
			width 100.%

			rule 'th' do
				border bottom: [1.px, :solid, '#ddd']
			end
		end
	end
end

end
